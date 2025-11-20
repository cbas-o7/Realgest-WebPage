FROM node:18

# Instalamos dependencias del sistema necesarias para compilar tfjs-node
# (Python y build-essential son requeridos por node-gyp)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias primero (para aprovechar caché de Docker)
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Reconstruir tfjs-node para asegurar compatibilidad con el sistema Linux del contenedor
RUN npm rebuild @tensorflow/tfjs-node --build-from-source

# Copiar el resto del código
COPY . .

# Exponer el puerto
EXPOSE 3000

# Comando por defecto (iniciar servidor)
CMD ["npm", "start"]