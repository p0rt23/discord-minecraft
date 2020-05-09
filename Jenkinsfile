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
        stage('Test') {
            steps {
                sh 'npm install'
                sh "npm run test"
            }
        }
        stage('Build') {
            steps {
                sh 'echo "TOKEN=$DISCORD_TOKEN" > ./discord-minecraft/.env'       
                sh "docker build -t p0rt23/${image_name}:${image_tag} ."
            }
        }
        stage('Deploy') {
            when {
                branch "master"
            }
            steps {
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
