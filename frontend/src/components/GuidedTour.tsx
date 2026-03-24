import { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

export default function GuidedTour() {
    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    useEffect(() => {
        const checkTour = async () => {
            if (!user?.tenantId) return;

            const tourKey = `tour_completed_${user.tenantId}`;
            const hasSeen = localStorage.getItem(tourKey);
            if (hasSeen) return;

            try {
                const { data } = await client.get('/products');
                // If the user has absolutely no products, show the tour
                if (data.length === 0) {
                    // Wait a bit for layout to render
                    setTimeout(() => setRun(true), 500);
                } else {
                    localStorage.setItem(tourKey, 'true');
                }
            } catch (err) {
                console.error('Failed to check tour status', err);
            }
        };
        checkTour();
    }, [user?.tenantId]);

    const steps: Step[] = [
        {
            target: 'body',
            content: '¡Hagamos un recorrido rápido! Como el sistema es nuevo, lo primero que debes hacer es ir al almacén para registrar los productos.',
            placement: 'center',
            disableBeacon: true,
            title: '¡Bienvenido a AdminSaaS!',
        },
        {
            target: '.nav-inventory',
            content: 'Haz clic aquí en "Stock" o usa el botón Siguiente para ir a configurar tu inventario de productos.',
            disableBeacon: true,
            placement: 'top',
            spotlightClicks: true,
        },
        {
            target: '.add-product-btn',
            content: '¡Excelente! Usa este botón para añadir tu primer producto o la materia prima que compras para el negocio.',
            disableBeacon: true,
            spotlightClicks: true,
            title: '1. Añadir Productos',
        },
        {
            target: '.transform-product-btn',
            content: 'Y cuando tengas materia prima (ej. Harina), usa este botón para transformarla en el producto que vas a vender (ej. Pan).',
            disableBeacon: true,
            title: '2. Producción y Transformación',
        }
    ];

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, type, index, action } = data;

        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
            setRun(false);
            if (user?.tenantId) {
                localStorage.setItem(`tour_completed_${user.tenantId}`, 'true');
            }
        } else if (type === 'step:after' || type === 'error:target_not_found') {
            const newIndex = index + (action === 'prev' ? -1 : 1);

            // If moving forward from step 1 (nav-inventory) to step 2 (add-product), ensure we are on /inventory
            if (index === 1 && action === 'next' && location.pathname !== '/inventory') {
                navigate('/inventory');
                // Give it a small delay to render the next page
                setTimeout(() => setStepIndex(newIndex), 100);
                return;
            }

            setStepIndex(newIndex);
        }
    };

    if (!run) return null;

    return (
        <Joyride
            steps={steps}
            run={run}
            stepIndex={stepIndex}
            continuous={true}
            showSkipButton={true}
            showProgress={true}
            callback={handleJoyrideCallback}
            disableOverlayClose={true}
            spotlightClicks={true}
            styles={{
                options: {
                    primaryColor: '#007bff',
                    zIndex: 10000,
                    textColor: '#212529',
                },
                tooltipContainer: {
                    textAlign: 'left'
                },
                buttonNext: {
                    backgroundColor: '#007bff',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)'
                },
                buttonBack: {
                    marginRight: 10,
                }
            }}
            locale={{
                back: 'Atrás',
                close: 'Cerrar',
                last: 'Entendido, ¡A empezar!',
                next: 'Siguiente',
                skip: 'Saltar Tour',
            }}
        />
    );
}
