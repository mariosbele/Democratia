# Dockerfile για το backend της Democratia.
#
# ΣΗΜΑΝΤΙΚΟ: το build context πρέπει να είναι η ΡΙΖΑ του repository, ώστε να
# συμπεριληφθεί και το demo περιεχόμενο από src/data (προαιρετικό — το backend
# λειτουργεί και χωρίς αυτό, με τα 3 επίπεδα ενσωματωμένα).
#
#   docker build -f server/Dockerfile -t democratia-server .
#   docker run -p 8080:8080 -v democratia-data:/data democratia-server
#
# Δεν υπάρχουν εξωτερικά dependencies — μόνο built-in modules του Node 22.

FROM node:22-alpine

WORKDIR /app

# Κώδικας backend
COPY server/package.json ./package.json
COPY server/src ./src

# Demo περιεχόμενο (προαιρετικό). Αν τρέξεις build με context=server/, αφαίρεσε
# αυτή τη γραμμή — το backend θα ξεκινήσει με τα επίπεδα και θα γεμίσει από sync.
COPY src/data /src/data

ENV NODE_ENV=production
ENV PORT=8080
ENV DB_PATH=/data/democratia.db

# Persistent volume για τη βάση SQLite
VOLUME ["/data"]
EXPOSE 8080

CMD ["node", "--experimental-sqlite", "src/index.js"]
