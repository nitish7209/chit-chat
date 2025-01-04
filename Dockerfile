# Step 1: Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Step 2: Set the working directory in the container
WORKDIR /app

# Step 3: Copy package.json and package-lock.json
# to install dependencies before copying the rest of the code
COPY package*.json ./ 

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the rest of the application code
COPY . . 

# Step 6: Expose port that the app will listen on
EXPOSE 3000

# Step 7: Define the command to run your app (app.js as the main file)
CMD ["node", "app.js"]
