import { memo } from 'react';
import { useWebSocketContext } from '../../context/WebSocketContext';
import type { ConnectionStatus as StatusType } from '../../types';

const STATUS_CONFIG: Record<StatusType, { label: string; className: string }> = {
  connected: { label: 'Connected', className: 'status-connected' },
  connecting: { label: 'Connecting…', className: 'status-connecting' },
  reconnecting: { label: 'Reconnecting…', className: 'status-reconnecting' },
  disconnected: { label: 'Disconnected', className: 'status-disconnected' },
};

export const ConnectionStatus = memo(function ConnectionStatus() {
  const { status } = useWebSocketContext();
  const config = STATUS_CONFIG[status];

  return (
    <div className={`connection-status ${config.className}`} id="connection-status">
      <span className="status-dot" />
      <span className="status-label">{config.label}</span>
    </div>
  );
});
