#! /bin/bash

##############
# 0. GIT WAY #
##############

#cd public
#git add .
#git commit -am "initial commit"
#git push
#
#ssh aws << EOF
#  cd personal-website-two/public/
#  git pull
#EOF


##################
# 1. REGULAR WAY #
##################

ssh aws << EOF
  rm -rf tetris/
  mkdir tetris
EOF

scp -i ~/.ssh/keys/aws-marcuschiu.pem -r ./dist ec2-user@www.marcuschiu.com:~/tetris


#####################
# 2. COMPRESSED WAY #
#####################

#ssh -i ~/.ssh/keys/aws-marcuschiu.pem ec2-user@www.marcuschiu.com << EOF
#  rm -rf personal-website-two/
#  mkdir personal-website-two
#EOF
#
#tar czf public.tar.gz public
#scp -i ~/.ssh/keys/aws-marcuschiu.pem -r ./public.tar.gz ec2-user@www.marcuschiu.com:~/personal-website-two
#ssh -i ~/.ssh/keys/aws-marcuschiu.pem ec2-user@www.marcuschiu.com << EOF
#  cd personal-website-two
#  tar -xvzf public.tar.gz
#  rm public.tar.gz
#EOF