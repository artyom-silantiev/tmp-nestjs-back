#!/usr/bin

timestamp=$(date +%s)
front_app_name=main
new_dir_temp=${front_app_name}_new_${timestamp}
old_dir_temp=${front_app_name}_old_${timestamp}

mkdir -p ./data
mkdir -p ./data/frontends

cd ../frontend_main
{
  git pull
  yarn
  yarn build
} || {
  echo 'error exit'
  exit 1
}

cp -r ./dist/spa ../backend/data/frontends/${new_dir_temp}
cd ../backend/data/frontends/
mv ./${front_app_name} ./${old_dir_temp}
mv ./${new_dir_temp} ./${front_app_name}
rm -rf ./${old_dir_temp}

cd ../../
exit 0
