#!/usr/bin/env bash
set -e
set -x

CLUSTER=kates
SERVICE=Veronica
DOCKER_USERNAME=servercobra
DOCKER_EMAIL=josh@pcsforeducation.com
family="Veronica"

# more bash-friendly output for jq
JQ="jq --raw-output --exit-status"

configure_aws_cli() {
	aws --version
	aws configure set default.region us-east-1
	aws configure set default.output json
}

docker_login() {
  docker login --email $DOCKER_EMAIL --username $DOCKER_USERNAME --password $DOCKER_PASSWORD
}

deploy_cluster() {
    make_task_def
    register_definition
    if [[ $(aws ecs update-service --cluster $CLUSTER --service $SERVICE --task-definition $revision | \
                   $JQ '.service.taskDefinition') != $revision ]]; then
        echo "Error updating service."
        return 1
    fi

    # wait for older revisions to disappear
    # not really necessary, but nice for demos
    for attempt in {1..30}; do
        if stale=$(aws ecs describe-services --cluster $CLUSTER --services $SERVICE | \
                       $JQ ".services[0].deployments | .[] | select(.taskDefinition != \"$revision\") | .taskDefinition"); then
            echo "Waiting for stale deployments:"
            echo "$stale"
            sleep 5
        else
            echo "Deployed!"
            return 0
        fi
    done
    echo "Service update took too long."
    return 1
}

make_task_def() {
      task_template=$(cat <<EOF
  [{
      "volumesFrom": [],
      "memory": 500,
      "portMappings": [
        {
          "hostPort": 8080,
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "mountPoints": [],
      "name": "Veronica",
      "environment": [
        {
          "name": "CONFIG_URL",
          "value": "$CONFIG_URL"
        }
      ],
      "image": "servercobra/veronica:latest",
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "veronica",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "veronica"
        }
      },
      "cpu": 0,
      "memoryReservation": 300
}]  
EOF)
  echo $task_template
  task_def=$(printf "$task_template" $AWS_ACCOUNT_ID $CIRCLE_SHA1)
}

push_image() {
	docker push servercobra/veronica
}

register_definition() {
  if revision=$(aws ecs register-task-definition --task-role-arn "arn:aws:iam::116843475613:role/ecs-use-s3-dynamo" --container-definitions "$task_def" --family $family | $JQ '.taskDefinition.taskDefinitionArn'); then
    echo "Revision: $revision"
  else
    echo "Failed to register task definition"
    return 1
  fi
}

configure_aws_cli
docker_login
push_image
deploy_cluster
