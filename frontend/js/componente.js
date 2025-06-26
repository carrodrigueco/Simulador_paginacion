export const componente = {
            // exposed to all expressions
            paginas: [],
            mensaje_limite: false,
            limite_simulacion: 12,
            simulando: false, // Propiedad para controlar el estado de los botones
            fifo_steps: [],
            // AHORA ESPERAMOS UN OBJETO STATS
            fifo_stats: { hit: 0, faults: 0, discard: 0 }, 
            lru_steps: [],
            // AHORA ESPERAMOS UN OBJETO STATS
            lru_stats: { hit: 0, faults: 0, discard: 0 }, 

            // Nuevas propiedades para la simulación en tiempo real
            current_fifo_step_index: -1, 
            current_lru_step_index: -1,
            simulation_interval_id: null,
            simulation_speed: 1000,
            simulation_active: false,

            // Propiedades para el manual de usuario (CORRECCIÓN CLAVE: ESTÁN DENTRO DEL OBJETO)
            showManual: false, 
            currentManualSection: 'introduccion',

            // getters (no se usó plusOne, pero se mantiene si es necesario)
            get plusOne()
            {
                return this.count + 1
            },
            // methods
            AgregarPagina(pagina, color)
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
            LimpiarPaginas()
            {
                this.paginas = [];
                this.mensaje_limite = false;
                this.resetSimulation(); // También reinicia la simulación al limpiar
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
                this.pauseSimulation(); 
                this.fifo_steps = [];
                this.fifo_stats = { hit: 0, faults: 0, discard: 0 }; // Reiniciar stats al simular
                this.lru_steps = [];
                this.lru_stats = { hit: 0, faults: 0, discard: 0 }; // Reiniciar stats al simular
                this.current_fifo_step_index = -1; 
                this.current_lru_step_index = -1;
                this.simulation_active = false; 

                const secuencia_paginas = this.paginas.map(p => p.pagina);
                
                if (secuencia_paginas.length === 0) {
                    alert("Por favor, agregue páginas a la secuencia antes de simular.");
                    return;
                }
                
                this.simulando = true; // Deshabilita los botones de simulación y limpiar
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

                    // Almacenamos los pasos completos de la simulación y las estadísticas
                    this.fifo_steps = data.fifo.steps;
                    this.fifo_stats = data.fifo.stats; // ASIGNAR OBJETO COMPLETO DE STATS
                    this.lru_steps = data.lru.steps;
                    this.lru_stats = data.lru.stats; // ASIGNAR OBJETO COMPLETO DE STATS

                    this.simulation_active = true; // La simulación está lista para reproducirse
                    // Opcional: Iniciar la reproducción automáticamente al recibir los resultados
                    // this.playSimulation(); 
                }
                catch (error)
                {
                    console.error("Error al simular:", error);
                    alert("Ocurrió un error al simular. Por favor, revisa la consola para más detalles.");
                    this.simulation_active = false; 
                } finally {
                    this.simulando = false; // Se vuelve a habilitar al finalizar (éxito o error)
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
                        // Scroll automático para mantener el paso actual visible
                        this.$nextTick(() => {
                            const currentFifoRow = document.querySelector(`.algorithm-results:first-child .simulation-table tbody tr.current-step`);
                            if (currentFifoRow) {
                                currentFifoRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }
                        });
                    } else {
                        fifo_done = true;
                    }

                    // Avanzar paso LRU (si hay datos, si no, se asume hecho)
                    if (this.lru_steps.length > 0 && this.current_lru_step_index < this.lru_steps.length - 1) {
                        this.current_lru_step_index++;
                        this.$nextTick(() => {
                            const currentLruRow = document.querySelector(`.algorithm-results:last-child .simulation-table tbody tr.current-step`);
                            if (currentLruRow) {
                                currentLruRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }
                        });
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
                this.simulando = false;
                this.pauseSimulation(); // Detener cualquier simulación en curso
                this.current_fifo_step_index = -1; // Reiniciar índices
                this.current_lru_step_index = -1;
                this.LimpiarPaginas(); // Limpiar páginas al reiniciar
                console.log("Simulación reiniciada.");
            },

            updateSimulationSpeed(event) {
                this.simulation_speed = parseInt(event.target.value);
                // Si la simulación está activa, pausarla y reiniciarla con la nueva velocidad
                if (this.simulation_interval_id !== null) {
                    this.pauseSimulation();
                    this.playSimulation();
                }
            },

            // Métodos para el manual de usuario (CORRECCIÓN CLAVE: ESTÁN DENTRO DEL OBJETO)
            toggleManual() {
                this.showManual = !this.showManual;
                // Al abrir/cerrar el manual, ajusta el overflow del body para evitar scroll de fondo
                document.body.style.overflow = this.showManual ? 'hidden' : '';
            },
            setManualSection(sectionName) {
                this.currentManualSection = sectionName;
            }
        };