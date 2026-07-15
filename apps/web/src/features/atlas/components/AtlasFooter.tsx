interface AtlasFooterProps {
  straitCount: number;
}

export function AtlasFooter({ straitCount }: AtlasFooterProps) {
  return (
    <footer>Fathom — {straitCount} of the world's key straits, plotted for the curious.</footer>
  );
}
