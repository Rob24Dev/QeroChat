import { useEffect, useState } from 'react';

export default function Toast() {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    let h: number | undefined;
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      setShow(true);
      clearTimeout(h);
      h = window.setTimeout(() => setShow(false), 2600);
    };
    window.addEventListener('app-toast', on);
    return () => { window.removeEventListener('app-toast', on); clearTimeout(h); };
  }, []);

  return <div id="toast" className={show ? 'show' : ''}>{msg}</div>;
}
