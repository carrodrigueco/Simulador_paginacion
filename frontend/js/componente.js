export const componente = {
            // exposed to all expressions
            paginas: [],
            mensaje_limite: false,
            limite_simulacion: 12,
            fifo_steps: [],
            fifo_faults: 0,
            lru_steps: [],
            lru_faults: 0,

            // Propiedades para la simulación en tiempo real
            current_fifo_step_index: -1,
            current_lru_step_index: -1,
            simulation_interval_id: null,
            simulation_speed: 1000,
            simulation_active: false,

            // Nuevas propiedades para el manual de usuario
            showManual: false,
            currentManualSection: 'introduccion', // Sección actual del manual

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
                this.pauseSimulation();
                this.fifo_steps = [];
                this.fifo_faults = 0;
                this.lru_steps = [];
                this.lru_faults = 0;
                this.current_fifo_step_index = -1;
                this.current_lru_step_index = -1;
                this.simulation_active = false;

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

                    this.fifo_steps = data.fifo.steps;
                    this.fifo_faults = data.fifo.faults;
                    this.lru_steps = data.lru.steps;
                    this.lru_faults = data.lru.faults;

                    this.simulation_active = true;
                }
                catch (error)
                {
                    console.error("Error al simular:", error);
                    alert("Ocurrió un error al simular. Por favor, revisa la consola para más detalles.");
                    this.simulation_active = false;
                }
            },

            playSimulation() {
                if (!this.simulation_active || this.fifo_steps.length === 0) {
                    alert("Por favor, simule una secuencia primero.");
                    return;
                }
                if (this.simulation_interval_id !== null) return;
                
                if (this.current_fifo_step_index >= this.fifo_steps.length - 1 && this.current_lru_step_index >= this.lru_steps.length - 1) {
                    this.resetSimulation();
                }

                this.simulation_interval_id = setInterval(() => {
                    let fifo_done = false;
                    let lru_done = false;

                    if (this.current_fifo_step_index < this.fifo_steps.length - 1) {
                        this.current_fifo_step_index++;
                        this.$nextTick(() => {
                            const currentFifoRow = document.querySelector(`.algorithm-results:first-child .simulation-table tbody tr.current-step`);
                            if (currentFifoRow) {
                                currentFifoRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }
                        });
                    } else {
                        fifo_done = true;
                    }

                    if (this.lru_steps.length > 0 && this.current_lru_step_index < this.lru_steps.length - 1) {
                        this.current_lru_step_index++;
                        this.$nextTick(() => {
                            const currentLruRow = document.querySelector(`.algorithm-results:last-child .simulation-table tbody tr.current-step`);
                            if (currentLruRow) {
                                currentLruRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }
                        });
                    } else if (this.lru_steps.length === 0) {
                        lru_done = true;
                    } else {
                        lru_done = true;
                    }

                    if (fifo_done && lru_done) {
                        this.pauseSimulation();
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
                this.pauseSimulation();
                this.current_fifo_step_index = -1;
                this.current_lru_step_index = -1;
                console.log("Simulación reiniciada.");
            },

            updateSimulationSpeed(event) {
                this.simulation_speed = parseInt(event.target.value);
                if (this.simulation_interval_id !== null) {
                    this.pauseSimulation();
                    this.playSimulation();
                }
            },

            // Métodos para el manual de usuario
            toggleManual() {
                this.showManual = !this.showManual;
                document.body.style.overflow = this.showManual ? 'hidden' : ''; // Evita el scroll del fondo
            },
            setManualSection(sectionName) {
                this.currentManualSection = sectionName;
            }
        };