import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import PostService from '../services/PostService'
import Auth from '../services/Auth'
import axios from 'axios'

Vue.use(Vuex)
// State - the source of truth that drives our app;
export default new Vuex.Store({
	strict: true,
	state: {
		token: null,
		user: {},
		isLoggedIn: false,
		isLoading: false,

		posts: [],
		users: [],
		post: {},
		message: '',
		error: ''
	},
	plugins: [
		createPersistedState({
			storage: window.sessionStorage
		})
	],

	// Access the state
	getters: {
		posts (state) {
			return state.posts
		},
		post (state) {
			return state.post
		},
		users (state) {
			return state.users
		},
		user (state) {
			return state.user
		},
		messageReturn (state) {
			return state.message
		},
		errorMessage (state) {
			return state.error
		},
		isLogged (state) {
			return state.isLoggedIn
		}
	},

	// Commit and track state changes
	mutations: {
		// users
		SET_TOKEN (state, token) {
			state.token = token
			if (token) {
				state.isLoggedIn = true
			} else {
				state.isLoggedIn = false
			}
		},
		DELETE_TOKEN (state) {
			state.token = null
			state.user = ''
			state.isLoggedIn = false
		},
		SET_USER (state, user) {
			state.user = user
		},
		GET_USER_BY_ID (state, user) {
			state.user = user
		},
		GET_USERS (state, users) {
			state.users = users
		},
		UPDATE_ACCOUNT (state, id, user) {
			Object.assign(
				state.users.filter((element) => element.id === id),
				user
			)
			state.message = 'Modified successfully!!'
		},
		DELETE_ACCOUNT (state, id) {
			state.users = [...state.users.filter((element) => element.id !== id)]
			state.message = 'Account successfully deleted!!'
		},
		LOG_OUT (state) {
			sessionStorage.clear()
			state.token = null
			state.user = null
			state.isLoggedIn = false
			state.message = ''
			state.error = ''
		},
		// end users

		// posts

		GET_POSTS (state, posts) {
			(state.posts = posts) (state.isLoading = false)
		},
		GET_HOT_POSTS (state, posts) {
			(state.posts = posts) (state.isLoading = false)
		},
		GET_POST_BY_ID (state, post) {
			state.post = post
			state.isLoading = false
		},
		ADD_POST (state, post) {
			state.posts = [post, ...state.posts]
			state.message = 'Post added successfully!!'
		},
		UPDATE_POST (state, id, post) {
			Object.assign(
				state.posts.find((element) => element.id === id),
				post
			)

			state.message = 'Post edited successfully!!'
		},

		DELETE_POST (state, id) {
			state.posts = [...state.posts.filter((element) => element.id !== id)]
			state.message = 'Post deleted successfully!!'
		},
		// end posts

		// comments
		COMMENT_POST (state, comment) {
			state.posts = [comment, ...state.posts]
			state.message = 'Post commented'
		},
		DELETE_COMMENT (state, id) {
			state.posts = [...state.posts.filter((element) => element.id !== id)]
			state.message = 'Comment deleted successfully!!'
		},
		// end comments

		// like

		LIKE_POST (state, like) {
			state.posts = [like, ...state.posts]
		}
		// end like
	},

	// Update the Vuex state
	actions: {
		// users
		setToken ({ commit }, token) {
			commit('SET_TOKEN', token)
		},
		deleteToken ({ commit }, token) {
			commit('DELETE_TOKEN', token)
		},
		logOut ({ commit }) {
			commit('LOG_OUT')
		},
		setUser ({ commit }, user) {
			commit('SET_USER', user)
		},
		getUsers ({ commit }) {
			Auth.getUsers().then((response) => {
				const users = response.data
				commit('GET_USERS', users)
			})
		},
		getUserById ({ commit }) {
			const id = this.state.user.id
			Auth.getUserById(id).then((response) => {
				const user = response.data
				commit('GET_USER_BY_ID', user)
			})
		},
		deleteAccount ({ commit }, id) {
			Auth.deleteAccount(id).then(() => {
				commit('DELETE_ACCOUNT', id)
			})
		},
		updateAccount ({ commit }, data) {
			const id = this.state.user.id
			axios
				.put(`http://localhost:3000/api/users/accounts/${id}`, data, {
					headers: { Authorization: this.state.token }
				})
				.then((response) => {
					const newUser = response.data
					commit('UPDATE_ACCOUNT', id, newUser)
				})
				.then(() => {
					PostService.getPosts().then((response) => {
						const posts = response.data
						commit('GET_POSTS', posts)
					})
				})
		},
		// end users

		// posts

		getPosts ({ commit }) {
			PostService.getPosts().then((response) => {
				const posts = response.data
				commit('GET_POSTS', posts)
			})
		},
		getHotPosts ({ commit }) {
			PostService.getHotPosts().then((response) => {
				const posts = response.data
				commit('GET_HOT_POSTS', posts)
			})
		},

		getPostById ({ commit }, id) {
			PostService.getPostById(id).then((response) => {
				const post = response.data
				commit('GET_POST_BY_ID', post)
			})
		},
		createPost ({ commit }, post) {
			PostService.createPost(post)
				.then((response) => {
					const post = response.data
					commit('ADD_POST', post)
				})
				.then(() => {
					PostService.getPosts().then((response) => {
						const posts = response.data
						commit('GET_POSTS', posts)
					})
				})
		},
		updatePost ({ commit }, data) {
			const id = this.state.post.id
			axios
				.put(`http://localhost:3000/api/posts/${id}`, data, {
					headers: { Authorization: this.state.token }
				})
				.then((response) => {
					const post = response.data
					commit('UPDATE_POST', id, post)
				})
		},
		deletePost ({ commit }, id) {
			PostService.deletePost(id)
				.then(() => {
					commit('DELETE_POST', id)
				})
				.then(() => {
					PostService.getPosts().then((response) => {
						const posts = response.data
						commit('GET_POSTS', posts)
					})
				})
		},

		// end posts

		// like
		likePost ({ commit }, payload) {
			axios
				.post(
					`http://localhost:3000/api/posts/${payload.id}/like`,
					payload.data,
					{ headers: { Authorization: this.state.token } }
				)
				.then((response) => {
					const like = response.data
					commit('LIKE_POST', like)
				})
				.then(() => {
					PostService.getPosts().then((response) => {
						const posts = response.data
						commit('GET_POSTS', posts)
					})
				})
		},

		// end like

		// comment
		commentPost ({ commit }, payload) {
			axios
				.post(
					`http://localhost:3000/api/posts/${payload.id}/comments`,
					payload.data,
					{ headers: { Authorization: this.state.token } }
				)
				.then((response) => {
					const comment = response.data
					commit('COMMENT_POST', comment)
				})
				.then(() => {
					PostService.getPosts().then((response) => {
						const posts = response.data
						commit('GET_POSTS', posts)
					})
				})
		},
		deleteComment ({ commit }, id) {
			PostService.deleteComment(id)
				.then(() => {
					commit('DELETE_COMMENT', id)
				})
				.then(() => {
					PostService.getPosts().then((response) => {
						const posts = response.data
						commit('GET_POSTS', posts)
					})
				})
		}
	}
})