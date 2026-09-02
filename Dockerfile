# Build stage
FROM golang:alpine AS builder

WORKDIR /app

# Copy the entire repository
COPY . .

# Move into backend directory
WORKDIR /app/backend

# Download modules and build
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/api ./cmd/api/main.go

# Final stage
FROM alpine:latest

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/api .

# Expose port (Northflank usually overrides this with an env var, but 8080 is standard)
EXPOSE 8080

# Run the binary
CMD ["./api"]
