import React from 'react';
import { Room } from '../types';
import { Users, Music, Star } from 'lucide-react';
import { formatCurrency } from '../services/pricing';

interface RoomCardProps {
  room: Room;
  selected: boolean;
  onSelect: (id: string) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, selected, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(room.id)}
      className={`
        relative overflow-hidden rounded-xl cursor-pointer group transition-all duration-300 border-2
        ${selected 
          ? 'border-neon-purple bg-zinc-900/80 scale-[1.02] shadow-xl shadow-purple-900/20' 
          : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-600 hover:bg-zinc-900/60'}
      `}
    >
      {/* Gradient accent header */}
      <div className={`h-2 w-full bg-gradient-to-r ${room.gradient}`} />
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-white">{room.name}</h3>
          <span className="bg-zinc-800 text-zinc-300 text-xs font-semibold px-2 py-1 rounded">
            {formatCurrency(room.pricePerHour)}/hr
          </span>
        </div>

        <p className="text-zinc-400 text-sm mb-4">{room.description}</p>

        <div className="flex items-center space-x-4 text-sm text-zinc-300 mb-4">
          <div className="flex items-center">
            <Users size={16} className="mr-1.5 text-neon-cyan" />
            {room.capacity}
          </div>
          <div className="flex items-center">
            <Music size={16} className="mr-1.5 text-neon-pink" />
            Pro Audio
          </div>
        </div>

        <div className="space-y-1">
          {room.features.slice(0, 2).map((feat, i) => (
            <div key={i} className="flex items-center text-xs text-zinc-500">
              <Star size={12} className="mr-1.5 text-yellow-500" />
              {feat}
            </div>
          ))}
        </div>
      </div>
      
      {/* Selection Circle */}
      <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
        ${selected ? 'border-neon-purple bg-neon-purple text-white' : 'border-zinc-700 bg-transparent'}
      `}>
        {selected && <div className="w-2 h-2 bg-white rounded-full" />}
      </div>
    </div>
  );
};
