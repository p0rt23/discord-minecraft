def image_name     = 'discord-minecraft'
def version        = '1.1.0'
def image_tag      = version
def container_name = image_name

pipeline {
    agent any
    environment {
        DISCORD_TOKEN = credentials('discord-minecraft')
    }
    stages {
        stage('Checkout') {
            steps {
                scm checkout
            }   
        }
        stage('Install Dependencies') {
            steps {
                sh "apk add nodejs"
                sh "npm install"
            }
        }
        stage('Run Tests') {
            steps {
                sh "npm run test"
            }
        }
        stage('Docker Build and Run') {
            when {
                branch "master"
            }
            steps {
                sh 'echo "TOKEN=$DISCORD_TOKEN" > ./discord-minecraft/.env'       
                sh "docker build -t p0rt23/${image_name}:${image_tag} ."
 
                script {
                    try {
                        sh "docker stop ${container_name}"
                        sh "docker rm ${container_name}"
                    }
                    catch (Exception e) { 
                        
                    }
                }
                sh """
                    docker run \
                        -d \
                        --restart="always" \
                        --network="elastic" \
                        --name="${container_name}" \
                        p0rt23/${image_name}:${image_tag}
                """
            }
        }
    }
    post {
        always {
            deleteDir()
        }
    }
}
