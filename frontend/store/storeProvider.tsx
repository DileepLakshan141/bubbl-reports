"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { makeStore } from "./store";
import persistStore from "redux-persist/lib/persistStore";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => makeStore());
  const [persistor] = useState(() => persistStore(store));

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
