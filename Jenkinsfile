def image_name = 'discord-minecraft'
def container_name, version, image_tag, token_credential, rcon_credential, node_env

if (env.BRANCH_NAME == 'master') {
    container_name   = image_name 
    token_credential = 'discord-minecraft'
    rcon_credential  = 'discord-minecraft-rcon'
    node_env         = 'production'
}
else {
    container_name   = "${image_name}-develop" 
    token_credential = 'discord-minecraft-develop'
    rcon_credential  = 'discord-minecraft-rcon-develop'
    node_env         = 'testing'
}

pipeline {
    agent any
    environment {
        DISCORD_TOKEN = credentials("${token_credential}")
        RCON_SECRET   = credentials("${rcon_credential}")
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
                    sh 'npm test'
                }
            }
        }
        stage('Docker Build and Run') {
            steps {
                sh 'echo "TOKEN=$DISCORD_TOKEN" > ./discord-minecraft/.env'       
                sh 'echo "RCON_SECRET=$RCON_SECRET" >> ./discord-minecraft/.env'       
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
                        --network=elastic \
                        --name=${container_name} \
                        -v minecraft-logs:/minecraft/logs:ro \
                        -v ${container_name}-preferences:/preferences \
                        --env NODE_ENV=${node_env} \
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
