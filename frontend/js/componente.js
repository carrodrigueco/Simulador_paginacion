export const componente = {
            // exposed to all expressions
            paginas: [],
            mensaje_limite: false,
            limite_simulacion: 12,
            fifo_steps: [], // Para almacenar los pasos de la simulación FIFO
            fifo_faults: 0, // Para el conteo de fallos FIFO
            lru_steps: [],  // Para almacenar los pasos de la simulación LRU
            lru_faults: 0,  // Para el conteo de fallos LRU
 
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
            async Simular() // Añadimos 'async' porque haremos una llamada al backend
            {
                // Limpiamos resultados anteriores
                this.fifo_steps = [];
                this.fifo_faults = 0;
                this.lru_steps = [];
                this.lru_faults = 0;

                // Preparamos los datos a enviar (solo las páginas sin el color)
                const secuencia_paginas = this.paginas.map(p => p.pagina);

                // Aquí iría la llamada al backend. Esto es un placeholder.
                // en el backend implementará la lógica en app.py para recibir esta secuencia y devolver los resultados de la simulación.
                try
                {
                    const response = await fetch('/simulate', { // Asume una ruta /simulate en tu backend
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

                    // Asume que el backend devuelve un objeto con 'fifo' y 'lru'
                    // cada uno con 'steps' y 'faults'
                    console.log(data.fifo);
                    this.fifo_steps = data.fifo.steps;
                    this.fifo_faults = data.fifo.faults;
                    this.lru_steps = data.lru.steps;
                    this.lru_faults = data.lru.faults;

                }
                catch (error)
                {
                    console.error("Error al simular:", error);
                    alert("Ocurrió un error al simular. Por favor, revisa la consola para más detalles.");
                }
            }
        };