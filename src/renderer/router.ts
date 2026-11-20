/* eslint-disable @typescript-eslint/no-var-requires */
// import Vue from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'


const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/search',
      name: 'Search',
      component: require('./views/Search/index.vue').default,
      meta: {
        name: 'Search',
      },
    },
    {
      path: '/musicHall',
      component: require('./views/MusicHall/index.vue').default,
      redirect: '/musicHall/recommend',
      children: [
        {
          path: 'recommend',
          name: 'MusicHallRecommend',
          component: require('./views/Discover/index.vue').default,
          meta: { name: 'MusicHall' },
        },
        {
          path: 'songlist',
          name: 'MusicHallSongList',
          component: require('./views/songList/List/index.vue').default,
          meta: { name: 'MusicHall' },
        },
        {
          path: 'leaderboard',
          name: 'MusicHallLeaderboard',
          component: require('./views/Leaderboard/index.vue').default,
          meta: { name: 'MusicHall' },
        },
      ],
    },
    {
      path: '/discover',
      name: 'Discover',
      component: require('./views/Discover/index.vue').default,
      meta: {
        name: 'Discover',
      },
    },
    {
      path: '/songList/list',
      name: 'SongList',
      component: require('./views/songList/List/index.vue').default,
      meta: {
        name: 'SongList',
      },
    },
    {
      path: '/songList/detail',
      name: 'SongListDetail',
      component: require('./views/songList/Detail/index.vue').default,
      meta: {
        name: 'SongList',
      },
    },
    {
      path: '/leaderboard',
      name: 'Leaderboard',
      component: require('./views/Leaderboard/index.vue').default,
      meta: {
        name: 'Leaderboard',
      },
    },
    {
      path: '/list',
      name: 'List',
      component: require('./views/List/index.vue').default,
      meta: {
        name: 'List',
      },
    },
    {
      path: '/download',
      name: 'Download',
      component: require('./views/Download/index.vue').default,
      meta: {
        name: 'Download',
      },
    },
    {
      path: '/setting',
      name: 'Setting',
      component: require('./views/Setting/index.vue').default,
      meta: {
        name: 'Setting',
      },
    },
    { path: '/:pathMatch(.*)*', redirect: '/musicHall' },
  ],
  linkActiveClass: 'active-link',
  linkExactActiveClass: 'exact-active-link',
})


export default router
