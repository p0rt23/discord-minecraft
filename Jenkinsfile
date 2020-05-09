pipeline {
    if (env.BRANCH_NAME != 'master') {
        currentBuild.result = 'SUCCESS'
        return
    }

    def image_name     = 'discord-minecraft'
    def version        = '1.0.0'
    def image_tag      = version
    def container_name = image_name

    environment {
        DISCORD_TOKEN = credentials('discord-minecraft')
    }
 
    stage('Build') {
        checkout scm
        sh 'echo \\"TOKEN=$DISCORD_TOKEN\\" > ./discord-minecraft/.env'       
        sh "docker build -t p0rt23/${image_name}:${image_tag} ."
    }

    stage('Deploy') {
        try {
            sh "docker stop ${container_name}"
            sh "docker rm ${container_name}"
        }
        catch (Exception e) { 
            
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
