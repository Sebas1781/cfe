import { LoadScript } from '@react-google-maps/api';

// Componente global para cargar Google Maps API una sola vez
export default function GoogleMapsLoader({ children }) {
  return (
    <LoadScript 
      googleMapsApiKey="AIzaSyC-g_SwMSxKdoeYDhbXPdgC6VFBSnf3yJo"
      loadingElement={<div>Cargando mapa...</div>}
    >
      {children}
    </LoadScript>
  );
}
