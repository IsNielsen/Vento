import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createLLM } = require('react-native-litert-lm');

const MODEL_FILENAME = 'gemma-4-E2B-it.litertlm';
const MODEL_URL = `https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/${MODEL_FILENAME}`;
const MODEL_DIR = `${FileSystem.documentDirectory}models/`;
const MODEL_PATH = `${MODEL_DIR}${MODEL_FILENAME}`;
const MODEL_SIZE_MB = 2580;

// LiteRT-LM SDK expects plain filesystem paths, not file:// URIs
function toSdkPath(uri: string): string {
  return Platform.OS === 'android' ? uri.replace('file://', '') : uri;
}

export type LLMStatus = 'idle' | 'downloading' | 'loading' | 'ready' | 'generating' | 'error';

interface LLMContextValue {
  status: LLMStatus;
  downloadProgress: number;
  errorMessage: string | null;
  loadFromUrl: () => Promise<void>;
  loadFromLocalFile: (uri: string) => Promise<void>;
  generate: (text: string, onToken: (token: string, done: boolean) => void) => void;
  stop: () => void;
  resetForChat: () => Promise<void>;
  modelSizeMB: number;
  modelStoragePath: string;
}

const LLMContext = createContext<LLMContextValue | null>(null);

function LLMProviderInner({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LLMStatus>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const llmRef = useRef<any>(null);
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true })
      .then(() => FileSystem.getInfoAsync(MODEL_PATH))
      .then(info => {
        if (info.exists) loadModel(MODEL_PATH);
      });
  }, []);

  const loadModel = async (path: string) => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const llm = createLLM();
      await llm.loadModel(toSdkPath(path), { backend: 'cpu' });
      llmRef.current = llm;
      setStatus('ready');
    } catch (err) {
      setErrorMessage(String(err));
      setStatus('error');
    }
  };

  const loadFromUrl = useCallback(async () => {
    setStatus('downloading');
    setDownloadProgress(0);
    setErrorMessage(null);
    try {
      await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
      const downloadResumable = FileSystem.createDownloadResumable(
        MODEL_URL,
        MODEL_PATH,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          if (totalBytesExpectedToWrite > 0) {
            setDownloadProgress(totalBytesWritten / totalBytesExpectedToWrite);
          }
        }
      );
      const result = await downloadResumable.downloadAsync();
      if (!result) throw new Error('Download returned no result');
      await loadModel(result.uri);
    } catch (err) {
      setErrorMessage(String(err));
      setStatus('error');
    }
  }, []);

  const loadFromLocalFile = useCallback(async (uri: string) => {
    setStatus('downloading');
    setDownloadProgress(0);
    setErrorMessage(null);
    try {
      await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
      await FileSystem.copyAsync({ from: uri, to: MODEL_PATH });
      setDownloadProgress(1);
      await loadModel(MODEL_PATH);
    } catch (err) {
      setErrorMessage(String(err));
      setStatus('error');
    }
  }, []);

  const generate = useCallback(
    (text: string, onToken: (token: string, done: boolean) => void) => {
      const llm = llmRef.current;
      if (!llm || isGeneratingRef.current) return;
      isGeneratingRef.current = true;
      setStatus('generating');
      try {
        llm.sendMessageAsync(text, (token: string, done: boolean) => {
          onToken(token, done);
          if (done) {
            isGeneratingRef.current = false;
            setStatus('ready');
          }
        });
      } catch (err) {
        isGeneratingRef.current = false;
        setErrorMessage(String(err));
        setStatus('error');
      }
    },
    []
  );

  const stop = useCallback(() => {
    const llm = llmRef.current;
    if (llm && typeof llm.stopGeneration === 'function') {
      llm.stopGeneration();
    }
    isGeneratingRef.current = false;
    setStatus('ready');
  }, []);

  const resetForChat = useCallback(async () => {
    const llm = llmRef.current;
    if (llm && typeof llm.resetConversation === 'function') {
      await llm.resetConversation();
    }
  }, []);

  return createElement(
    LLMContext.Provider,
    {
      value: {
        status,
        downloadProgress,
        errorMessage,
        loadFromUrl,
        loadFromLocalFile,
        generate,
        stop,
        resetForChat,
        modelSizeMB: MODEL_SIZE_MB,
        modelStoragePath: MODEL_PATH,
      },
    },
    children
  );
}

export { LLMProviderInner as LLMProvider };

export function useLLM(): LLMContextValue {
  const ctx = useContext(LLMContext);
  if (!ctx) throw new Error('useLLM must be used within LLMProvider');
  return ctx;
}
