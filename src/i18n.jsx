import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getLang, storeLang, tFor } from './i18n/core.js';

const LangContext = createContext({ lang: 'pl', setLang: () => {}, t: tFor('pl') });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(getLang);
  const value = useMemo(() => ({
    lang,
    setLang: next => {
      storeLang(next);
      setLangState(next);
    },
    t: tFor(lang),
  }), [lang]);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

// const { t, lang, setLang } = useT();
export function useT() {
  return useContext(LangContext);
}
