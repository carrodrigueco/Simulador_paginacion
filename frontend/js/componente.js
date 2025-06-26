export const componente = {
            // exposed to all expressions
            paginas: [],
            mensaje_limite: false,
            limite_simulacion: 12,
            fifo_steps: [],
            fifo_faults: 0,
            lru_steps: [],
            lru_faults: 0,

            // Nuevas propiedades para la simulación en tiempo real
            current_fifo_step_index: -1, // Índice del paso actual de FIFO que se muestra
            current_lru_step_index: -1, // Índice del paso actual de LRU que se muestra
            simulation_interval_id: null, // ID del intervalo para pausar/reproducir
            simulation_speed: 1000, // Velocidad de la simulación en ms (1000ms = 1 segundo por paso)
            simulation_active: false, // Indica si se ha simulado algo ya

            // getters
            get plusOne()
            {
                return this.count + 1
            },
            // methods
            AgregarPagina(pagina, color, value)
            {
                if(this.paginas.length < this.limite_simulacion)
                {
                    this.paginas.push({pagina: pagina, color: color});
                }
                else
                {
                    this.mensaje_limite = true;
                }
            },
            RetirarPagina(index)
            {
                this.paginas.splice(index, 1)
                if(this.paginas.length < this.limite_simulacion)
                {
                    this.mensaje_limite = false;
                }
            },
            async Simular()
            {
                // Limpiamos y reiniciamos todo antes de una nueva simulación
                this.pauseSimulation(); // Asegurarse de que cualquier simulación anterior esté detenida
                this.fifo_steps = [];
                this.fifo_faults = 0;
                this.lru_steps = [];
                this.lru_faults = 0;
                this.current_fifo_step_index = -1; // Reiniciar el índice de visualización
                this.current_lru_step_index = -1;
                this.simulation_active = false; // Se activa al recibir resultados

                const secuencia_paginas = this.paginas.map(p => p.pagina);

                if (secuencia_paginas.length === 0) {
                    alert("Por favor, agregue páginas a la secuencia antes de simular.");
                    return;
                }

                console.log("Enviando secuencia para simular:", secuencia_paginas);

                try
                {
                    const response = await fetch('/simulate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ sequence: secuencia_paginas })
                    });

                    if (!response.ok)
                    {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    console.log("Resultados de simulación recibidos:", data);

                    // Almacenamos los pasos completos de la simulación
                    this.fifo_steps = data.fifo.steps;
                    this.fifo_faults = data.fifo.faults;
                    this.lru_steps = data.lru.steps;
                    this.lru_faults = data.lru.faults;

                    this.simulation_active = true; // La simulación está lista para reproducirse
                    // Opcional: Iniciar la reproducción automáticamente al recibir los resultados
                    // this.playSimulation(); 
                }
                catch (error)
                {
                    console.error("Error al simular:", error);
                    alert("Ocurrió un error al simular. Por favor, revisa la consola para más detalles.");
                    this.simulation_active = false; // En caso de error, no está activa
                }
            },

            // Nuevos métodos para controlar la simulación en tiempo real
            playSimulation() {
                if (!this.simulation_active || this.fifo_steps.length === 0) {
                    alert("Por favor, simule una secuencia primero.");
                    return;
                }
                // Si ya está reproduciéndose o ha terminado, no hacer nada o reiniciar
                if (this.simulation_interval_id !== null) return;
                
                // Si ya llegó al final, reiniciarla antes de reproducir
                if (this.current_fifo_step_index >= this.fifo_steps.length - 1 && this.current_lru_step_index >= this.lru_steps.length - 1) {
                    this.resetSimulation();
                }

                // Iniciar o reanudar la simulación
                this.simulation_interval_id = setInterval(() => {
                    let fifo_done = false;
                    let lru_done = false;

                    // Avanzar paso FIFO
                    if (this.current_fifo_step_index < this.fifo_steps.length - 1) {
                        this.current_fifo_step_index++;
                    } else {
                        fifo_done = true;
                    }

                    // Avanzar paso LRU (si hay datos, si no, se asume hecho)
                    if (this.lru_steps.length > 0 && this.current_lru_step_index < this.lru_steps.length - 1) {
                        this.current_lru_step_index++;
                    } else if (this.lru_steps.length === 0) {
                        lru_done = true; // Si no hay datos LRU, se considera completado
                    } else {
                        lru_done = true;
                    }

                    // Si ambas simulaciones han llegado a su fin
                    if (fifo_done && lru_done) {
                        this.pauseSimulation(); // Pausar al final
                        console.log("Simulación completa.");
                    }
                }, this.simulation_speed);
            },

            pauseSimulation() {
                if (this.simulation_interval_id !== null) {
                    clearInterval(this.simulation_interval_id);
                    this.simulation_interval_id = null;
                    console.log("Simulación pausada.");
                }
            },

            resetSimulation() {
                this.pauseSimulation(); // Detener cualquier simulación en curso
                this.current_fifo_step_index = -1; // Reiniciar índices
                this.current_lru_step_index = -1;
                console.log("Simulación reiniciada.");
            },

            updateSimulationSpeed(event) {
                this.simulation_speed = parseInt(event.target.value);
                // Si la simulación está activa, pausarla y reiniciarla con la nueva velocidad
                if (this.simulation_interval_id !== null) {
                    this.pauseSimulation();
                    this.playSimulation();
                }
            }
        };