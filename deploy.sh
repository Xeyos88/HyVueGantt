set -e

npm run docs:build
cd docs/.vuepress/dist

git init
git add -A
git commit -m 'deploy'

git push -f git@github.com:Xeyos88/HyVueGantt.git master:gh-pages

cd -