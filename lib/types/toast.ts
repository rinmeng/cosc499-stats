import { ExternalToast, toast as sonnerToast } from 'sonner';

export interface ToastContextType {
  toast: {
    success: (message: string, data?: ExternalToast) => void;
    error: (message: string, data?: ExternalToast) => void;
    info: (message: string, data?: ExternalToast) => void;
    warning: (message: string, data?: ExternalToast) => void;
    promise: typeof sonnerToast.promise;
    custom: typeof sonnerToast.custom;
    message: typeof sonnerToast.message;
    loading: typeof sonnerToast.loading;
    dismiss: typeof sonnerToast.dismiss;
  };
}
