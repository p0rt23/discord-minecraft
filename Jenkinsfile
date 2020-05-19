def image_name     = 'discord-minecraft'
def container_name = image_name
def version, image_tag

pipeline {
    agent any
    environment {
        DISCORD_TOKEN = credentials('discord-minecraft')
    }
    stages {
        stage('Install Dependencies') {
            steps {
                sh 'apk add build-base'
                sh 'apk add nodejs'
                sh 'apk add npm'
                sh 'apk add python'
                script {
                    version = sh(
                        returnStdout: true, 
                        label: 'Getting version from package.json',
                        script: 'node -e "const { version } = require(\'./discord-minecraft/package.json\'); process.stdout.write(version)"'
                    ).trim()
                    println "Version: ${version}"
                    image_tag = version
                }
            }
        }
        stage('Run Tests') {
            steps {
                dir('discord-minecraft') {
                    sh 'npm install'
                    sh 'npm run test'
                }
            }
        }
        stage('Docker Build and Run') {
            when {
                branch 'master'
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
                        -v minecraft-logs:/minecraft/logs:ro \
                        p0rt23/${image_name}:${image_tag}
                """
                sh """
                    docker network connect minecraft ${container_name}
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
