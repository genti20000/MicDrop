
import React from 'react';
import { Room } from '../types';
import { Users, Music, Star } from 'lucide-react';

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
        relative overflow-hidden rounded-xl cursor-pointer group transition-all duration-300 border
        ${selected 
          ? 'border-[#FFD700] bg-neutral-900 shadow-[0_0_30px_rgba(255,215,0,0.1)]' 
          : 'border-neutral-800 bg-neutral-950 hover:border-neutral-600 hover:bg-neutral-900'}
      `}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-black uppercase tracking-tight text-white">{room.name}</h3>
          <span className="bg-[#FFD700] text-black text-xs font-bold px-2 py-1 rounded">
            £19pp (2hrs)
          </span>
        </div>

        <p className="text-neutral-400 text-sm mb-6 leading-relaxed">{room.description}</p>

        <div className="flex items-center space-x-6 text-sm text-neutral-300 mb-6">
          <div className="flex items-center">
            <Users size={16} className="mr-2 text-[#FFD700]" />
            {room.capacity} Guests
          </div>
          <div className="flex items-center">
            <Music size={16} className="mr-2 text-[#FFD700]" />
            Pro Audio
          </div>
        </div>

        <div className="space-y-2 border-t border-neutral-800 pt-4">
          {room.features.slice(0, 3).map((feat, i) => (
            <div key={i} className="flex items-center text-xs text-neutral-500 uppercase tracking-wide font-medium">
              <Star size={10} className="mr-2 text-neutral-600" />
              {feat}
            </div>
          ))}
        </div>
      </div>
      
      {/* Selection Circle */}
      <div className={`absolute top-4 right-4 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
        ${selected ? 'border-[#FFD700] bg-[#FFD700]' : 'border-neutral-700 bg-transparent'}
      `}>
      </div>
    </div>
  );
};
