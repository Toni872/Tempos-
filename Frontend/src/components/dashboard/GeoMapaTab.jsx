import React from 'react';
import { MapPin, NavigationArrow, Buildings } from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import Card, { CardBody } from '@/components/ui/Card';
import MapaAuditoria from './MapaAuditoria';

export default function GeoMapaTab({ registros = [], workCenters = [], employees = [] }) {
  return (
    <div className="space-y-8 h-[calc(100vh-160px)] flex flex-col">
      <SectionHeader 
        icon={NavigationArrow}
        title="Centro de Geolocalización"
        subtitle="Monitorea en tiempo real la ubicación de los fichajes y la cobertura de tus centros de trabajo."
      />

      <div className="flex-1 min-h-[500px] rounded-[32px] overflow-hidden border border-white/[0.06] bg-[#111114]">
        <MapaAuditoria 
          fichas={registros} 
          workCenters={workCenters} 
          employees={employees} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <Card>
          <CardBody className="p-6 flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                <MapPin weight="duotone" className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Puntos de Actividad</p>
                <p className="text-xl font-black text-white">{registros.filter(f => f.latitude || f.metadata?.location).length}</p>
             </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-6 flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-500">
                <Buildings weight="duotone" className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sedes Monitoreadas</p>
                <p className="text-xl font-black text-white">{workCenters.length}</p>
             </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6 flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-rose-600/10 flex items-center justify-center text-rose-500">
                <NavigationArrow weight="duotone" className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Fuera de Rango</p>
                <p className="text-xl font-black text-white">0</p>
             </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
