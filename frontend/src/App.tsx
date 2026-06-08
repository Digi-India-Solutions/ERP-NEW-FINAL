import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { KeyboardProvider } from "./contexts/KeyboardContext";
import { ToastProvider } from "./contexts/ToastContext";
import { useEffect } from "react";

import { isBackendAvailable } from "./api/client";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});
function App() {
  return (
    <QueryClientProvider client={queryClient}>
  <I18nextProvider i18n={i18n}>
    <KeyboardProvider>
      <ToastProvider>
        <BrowserRouter basename={__BASE_PATH__}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </KeyboardProvider>
  </I18nextProvider>
</QueryClientProvider>

  );
}

export default App;
