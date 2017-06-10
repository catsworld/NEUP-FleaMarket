/**
 * Created by zhouz on 2017/6/10.
 */

// 联系人列表
Vue.component('contact-list', {
    template: '#contact_list',
    data: function () {
        return {
            contacts: [],
            errorMessage: '',
            current_page: 0,
            last_page: null
        }
    },
    computed: {
        hasMore: function () {
            return this.current_page < this.last_page;
        }
    },
    mounted: function () {
        this.$nextTick(function () {
            this.$on('loadContactEvent', function () {
                this.clearContact();
                this.getHistoryContact();
            });
            this.$on('refreshContactEvent', function () {
                this.getNewContact();
            })
        })
    },
    methods: {
        clearContact: function () {
            this.current_page = 0;
            this.last_page = null;
            this.contacts = [];
        },
        getHistoryContact: function () {
            var vm = this;
            axios.get('/message/getHistoryMessageContact?page=' + (this.current_page + 1).toString())
                .then(function (response) {
                    vm.current_page = response.data.current_page;
                    vm.last_page = response.data.last_page;
                    for (var i in response.data.data)
                        vm.contacts.push(response.data.data[i]);
                })
                .catch(function (error) {
                    vm.errorMessage = error;
                })
        },
        getNewContact:  function () {
            var vm = this;
            axios.get('/message/getNewMessageContact')
                .then(function (response) {
                    for (var i in response.data)
                    {
                        vm.contacts = vm.contacts.filter(t => t.contact_id !== response.data[i].contact_id);
                        vm.contacts.unshift(response.data[i]);
                    }
                })
                .catch(function (error) {
                    vm.errorMessage = error;
                })
        },
        loadDialog: function (id, index) {
            var vm = this;
            this.$emit('load-dialog', id);
            var c = vm.contacts[index];
            c.unread_count = 0;
            Vue.set(vm.contacts, index, c);
        }
    }
});

// 对话窗格
Vue.component('message-dialog', {
    template: '#message_dialog',
    data: function () {
        return {
            messages: [],
            errorMessage: '',
            current_page: 0,
            last_page: null,
            contact_id: null,
            isHidden: true,
            inputMessage: '',
            token: ''
        }
    },
    mounted: function () {
        this.$nextTick(function () {
            this.$on('loadDialogHandler', function (id) {
                this.clearMessage();
                this.getHistoryMessage(id);
            });
            this.$on('refreshMessageEvent', function () {
                this.getNewMessage();
            })
        })
    },
    computed: {
        hasMore: function () {
            return this.current_page < this.last_page;
        },
        postData: function () {
            return {
                content: this.inputMessage,
                receiver: this.contact_id,
                _token: this.token
            }
        }
    },
    methods: {
        getHistoryMessage: function (contact_id) {
            var vm = this;
            if (contact_id === 0 || this.contact_id === contact_id) {
                contact_id = this.contact_id;
                axios.get('/message/getHistoryMessage?contact_id=' + contact_id.toString() + '&page=' + (this.current_page + 1).toString())
                    .then(function (response) {
                        vm.current_page = response.data.current_page;
                        vm.last_page = response.data.last_page;
                        for (var i in response.data.data)
                            vm.messages.unshift(response.data.data[i]);
                        vm.isHidden = false;
                    })
                    .catch(function (error) {
                        vm.errorMessage = error;
                    })
            }
            else {
                axios.get('/message/getHistoryMessage?contact_id=' + contact_id.toString())
                    .then(function (response) {
                        vm.current_page = response.data.current_page;
                        vm.last_page = response.data.last_page;
                        vm.messages = response.data.data.reverse();
                        vm.isHidden = false;
                    })
                    .catch(function (error) {
                        vm.errorMessage = error;
                    })
                this.contact_id = contact_id;
            }
        },
        clearMessage: function() {
            this.current_page = 0;
            this.last_page = null;
            this.messages = [];
        },
        sendMessage: function () {
            var vm = this;
            vm.token = $('#token').val();
            axios.post('/message', this.postData)
                .then(function (response) {
                    vm.messages.push(response.data.msg);
                    vm.inputMessage = '';
                })
                .catch(function (error) {
                    vm.errorMessage = error;
                })
        },
        getNewMessage: function () {
            var vm = this;
            if (vm.contact_id)
            {
                axios.get('/message/getNewMessage?contact_id=' + vm.contact_id.toString())
                    .then(function (response) {
                        for (var i in response.data)
                            vm.messages.push(response.data[i]);
                    })
                    .catch(function (error) {
                        vm.errorMessage = error;
                    })
            }
        }
    }
});

// 创建根实例
var Message = new Vue({
    el: '#message',
    methods: {
        startLoop: function () {
            var vm = this;
            vm.loadContact();
            window.setInterval(function() {
                vm.refreshContact();
                vm.refreshMessage();
            }, 5000);
        },
        loadContact: function () {
            this.$refs.contactList.$emit('loadContactEvent')
        },
        refreshContact: function () {
            this.$refs.contactList.$emit('refreshContactEvent')
        },
        refreshMessage: function () {
            this.$refs.messageDialog.$emit('refreshMessageEvent')
        },
        loadDialogCallback: function (id) {
            this.$refs.messageDialog.$emit('loadDialogHandler', id)
        }
    }
});

$(function () {
    Message.startLoop();
});