/**
 * 简化版输入测试组件
 * 用于测试输入框的基本功能，隔离问题
 */

Component({
    data: {
        // 问题输入
        question: '',
        questionError: ''
    },

    methods: {
        /**
         * 输入问题
         */
        onQuestionInput(e) {
            console.log('=== 测试组件 onQuestionInput 触发 ===');
            console.log('事件对象:', e);
            console.log('输入值:', e.detail.value);
            
            const question = e.detail.value || '';
            console.log('处理后的值:', question, '长度:', question.length);
            
            this.setData({
                question,
                questionError: ''
            }, () => {
                console.log('setData完成，当前question:', this.data.question);
            });
        },

        /**
         * 问题输入框获得焦点
         */
        onQuestionFocus(e) {
            console.log('=== 测试组件 onQuestionFocus 触发 ===');
            this.setData({
                questionError: ''
            });
        },

        /**
         * 问题输入框失去焦点
         */
        onQuestionBlur(e) {
            console.log('=== 测试组件 onQuestionBlur 触发 ===');
            const question = (e.detail.value || '').trim();
            console.log('失去焦点时的值:', question, '长度:', question.length);
        },

        /**
         * 提交
         */
        onSubmit() {
            console.log('=== 测试组件 onSubmit 触发 ===');
            console.log('提交时的question:', this.data.question);
            
            wx.showToast({
                title: '提交成功',
                icon: 'success'
            });
        }
    }
});