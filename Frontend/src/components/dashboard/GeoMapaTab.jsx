import React from 'react';
import { MapPin, NavigationArrow, Buildings } from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import Card, { CardBody } from '@/components/ui/Card';
import MapaAuditoria from './MapaAuditoria';

export default function GeoMapaTab({ registros = [], workCenters = [], employees = [] }) {
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
      <SectionHeader 
        icon={NavigationArrow}
        title="Centro de Geolocalización"
        subtitle="Monitorea en tiempo real la ubicación de los fichajes."
      />

      <div className="flex-1 rounded-[32px] overflow-hidden border border-white/[0.06] bg-[#111114]">
        <MapaAuditoria 
          fichas={registros} 
          workCenters={workCenters} 
          employees={employees} 
        />
      </div>
    </div>
  );
}
