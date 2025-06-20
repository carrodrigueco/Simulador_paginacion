export const componente = {
            // exposed to all expressions
            paginas: [],
            mensaje_limite: false,
            // getters
            get plusOne()
            {
                return this.count + 1
            },
            // methods
            AgregarPagina(pagina, color, value)
            {
                if(this.paginas.length < 8)
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
                if(this.paginas.length < 8)
                {
                    this.mensaje_limite = false;
                }
            },
            Simular()
            {
                this.pagina;
            }
        };