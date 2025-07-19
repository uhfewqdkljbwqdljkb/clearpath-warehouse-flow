import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Badge } from '@/components/ui/badge';
import { mockClients, warehouseZones } from '@/data/mockData';
import { ClientAllocation } from '@/types';

interface WarehouseMapProps {
  allocations: ClientAllocation[];
}

const ZoneNode = ({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 border rounded-lg bg-white shadow-sm min-w-[180px]">
      <div className="text-sm font-medium mb-2">{data.zoneName}</div>
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">
          {data.rows} rows × {data.binsPerRow} bins
        </div>
        {data.clientName && (
          <Badge variant="outline" className="text-xs">
            {data.clientName}
          </Badge>
        )}
        <div className="text-xs">
          <span className={`inline-block px-2 py-1 rounded text-white text-xs
            ${data.utilization > 80 ? 'bg-red-500' : 
              data.utilization > 50 ? 'bg-yellow-500' : 'bg-green-500'}
          `}>
            {data.utilization}% used
          </span>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  zone: ZoneNode,
};

export const WarehouseMap: React.FC<WarehouseMapProps> = ({ allocations }) => {
  const initialNodes: Node[] = useMemo(() => 
    warehouseZones.map((zone, index) => {
      const allocation = allocations.find(a => a.zone_id === zone.id);
      const client = allocation ? mockClients.find(c => c.id === allocation.client_id) : null;
      const utilization = Math.round((zone.allocated_cubic_feet / zone.total_cubic_feet) * 100);

      return {
        id: zone.id,
        type: 'zone',
        position: { 
          x: (index % 2) * 300, 
          y: Math.floor(index / 2) * 150 
        },
        data: {
          zoneName: zone.name,
          rows: zone.total_rows,
          binsPerRow: zone.bins_per_row,
          clientName: client?.company_name,
          utilization,
          totalSpace: zone.total_cubic_feet,
          allocatedSpace: zone.allocated_cubic_feet,
        },
        draggable: false,
      };
    }), [allocations]);

  const initialEdges: Edge[] = [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="h-[500px] w-full border rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-slate-50"
      >
        <Background />
        <Controls />
        <MiniMap 
          zoomable 
          pannable 
          className="bg-white"
          nodeColor={(node) => {
            const utilization = (node.data?.utilization as number) || 0;
            return utilization > 80 ? '#ef4444' : 
                   utilization > 50 ? '#eab308' : '#22c55e';
          }}
        />
      </ReactFlow>
    </div>
  );
};