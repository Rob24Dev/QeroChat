import { useState } from 'react';
import { initials } from '../utils';

interface Props {
  user: { name: string; avatar?: string | null };
  cls: string;
}

export default function Avatar({ user, cls }: Props) {
  const [err, setErr] = useState(false);
  return (
      <span className={'avatar ' + cls}>
      <span className="ini">{initials(user.name || '? ?')}</span>
        {user.avatar && !err && (
            <img src={user.avatar} alt={user.name} onError={() => setErr(true)} />
        )}
    </span>
  );
}