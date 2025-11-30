import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import useFormStore from '../stores/formStore';
import useAuthStore from '../stores/authStore';
import { reportService } from '../services/reportService';

export default function FormularioTrabajador() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { saveFormData, addPendingForm, formData } = useFormStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: formData,
  });

  // Auto-guardar mientras escriben
  useEffect(() => {
    const subscription = watch((value) => {
      saveFormData(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, saveFormData]);

  const onSubmit = async (data) => {
    try {
      // Intentar enviar al servidor
      await reportService.submitForm({
        ...data,
        userId: user.uid,
        userName: user.displayName,
        timestamp: new Date().toISOString(),
      });
      
      alert('Formulario enviado correctamente');
      navigate('/confirmacion');
    } catch (error) {
      // Si falla (sin conexión), guardar offline
      console.error('Error al enviar, guardando offline:', error);
      await addPendingForm(data);
      alert('Sin conexión. El formulario se guardó y se enviará cuando haya internet.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Formulario de Reporte</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.displayName || user?.email}</span>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          
          {/* Sección 1: Información General */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Información General</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Folio *
                </label>
                <input
                  type="text"
                  {...register('folio', { required: 'El folio es requerido' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: CFE-2025-001"
                />
                {errors.folio && (
                  <p className="text-red-500 text-sm mt-1">{errors.folio.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  {...register('fecha', { required: 'La fecha es requerida' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.fecha && (
                  <p className="text-red-500 text-sm mt-1">{errors.fecha.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación *
                </label>
                <input
                  type="text"
                  {...register('ubicacion', { required: 'La ubicación es requerida' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dirección completa"
                />
                {errors.ubicacion && (
                  <p className="text-red-500 text-sm mt-1">{errors.ubicacion.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* Sección 2: Detalles del Trabajo */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalles del Trabajo</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Servicio *
                </label>
                <select
                  {...register('tipoServicio', { required: 'Selecciona un tipo de servicio' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecciona una opción</option>
                  <option value="instalacion">Instalación</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="reparacion">Reparación</option>
                  <option value="inspeccion">Inspección</option>
                </select>
                {errors.tipoServicio && (
                  <p className="text-red-500 text-sm mt-1">{errors.tipoServicio.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Trabajo *
                </label>
                <textarea
                  {...register('descripcion', { 
                    required: 'La descripción es requerida',
                    minLength: { value: 20, message: 'Mínimo 20 caracteres' }
                  })}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe detalladamente el trabajo realizado..."
                />
                {errors.descripcion && (
                  <p className="text-red-500 text-sm mt-1">{errors.descripcion.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* Sección 3: Materiales Utilizados */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Materiales Utilizados</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lista de Materiales
              </label>
              <textarea
                {...register('materiales')}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 
- Cable calibre 12: 50m
- Postes de concreto: 2 unidades
- Transformador: 1 unidad"
              />
            </div>
          </section>

          {/* Sección 4: Observaciones */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Observaciones</h2>
            
            <textarea
              {...register('observaciones')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Notas adicionales, incidencias, recomendaciones..."
            />
          </section>

          {/* Botones */}
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enviar Formulario
            </button>
          </div>
        </form>

        {/* Indicador de guardado automático */}
        <p className="text-center text-sm text-gray-500 mt-4">
          💾 Tus cambios se guardan automáticamente
        </p>
      </main>
    </div>
  );
}
