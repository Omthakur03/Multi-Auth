pipeline {
    agent any

    environment {
        // 1. Docker Registry Settings (Docker Hub Credentials ID configured in Jenkins)
        DOCKER_HUB_CREDS = credentials('Docker-ID')
        DOCKER_IMAGE     = 'omthakur03/auth-service'
    }

    stages {
        stage('Pull Repository') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image ${DOCKER_IMAGE}:latest..."
                    sh "docker build -t ${DOCKER_IMAGE}:latest -t ${DOCKER_IMAGE}:${BUILD_NUMBER} ."
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    echo "Logging into Docker Hub and pushing image..."
                    sh "echo ${DOCKER_HUB_CREDS_PSW} | docker login -u ${DOCKER_HUB_CREDS_USR} --password-stdin"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                    sh "docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                }
            }
        }

        stage('Deploy Container') {
            steps {
                script {
                    echo "Deploying container on the target EC2 host..."
                    
                    sh "docker ps -a -q --filter name=auth-service-app | xargs -r docker rm -f"
                    
                    sh "docker run -d \
                        -p 5000:5000 \
                        --env-file /opt/env/.env.auth-service \
                        --name auth-service-app \
                        --restart always \
                        ${DOCKER_IMAGE}:latest"
                }
            }
        }
    }

    post {
        cleanup {
            echo "Cleaning up local workspace images to prevent storage exhaustion..."
            sh "docker rmi ${DOCKER_IMAGE}:${BUILD_NUMBER} || true"
        }
    }
}
