import { useT } from '../../i18n/locale';

interface AtlasFooterProps {
  straitCount: number;
}

export function AtlasFooter({ straitCount }: AtlasFooterProps) {
  const t = useT();
  return <footer>{t('footer.line', { count: straitCount })}</footer>;
}
