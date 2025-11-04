import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ShoppingCart } from 'lucide-react';
import { BaseNode } from './BaseNode';

export default memo(({ data, selected }: NodeProps) => {
  return (
    <BaseNode
      data={data}
      selected={selected}
      icon={ShoppingCart}
      defaultColor="#ff00ff"
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      <Handle type="source" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </BaseNode>
  );
});
