window.framework7 = new Framework7();
window.$$ = Dom7;

$(document).on('ready', function() {
    var taskList = $('.js-list'), listWrapper = $('.js-list-wrapper');
    var noContent = $('.js-no-content');
    var bus = Caravel.get('Home');
    var template = null;
    var ptrContent = $$('.pull-to-refresh-content');
    var checkboxes;

    ptrContent.on('refresh', function() {
        bus.post('Refresh');
    });

    bus.register("Tasks", function(name, data) {
        if (template == null) {
            var t = $('.js-task-template');
            template = t.clone();
            t.remove();
        }

        framework7.pullToRefreshDone();
        taskList.empty();
        checkboxes = {};

        if (data.length == 0) {
            listWrapper.hide();
            noContent.show();
        } else {
            noContent.hide();
            listWrapper.show();

            for (var i = 0, s = data.length; i < s; i++) {
                var capture = function(e, t) {
                    var input = t.find('input');
                    input.val(e);
                    input.prop('checked', e.isCompleted);

                    t.find('.js-label').text(e.label);

                    checkboxes[e.id] = e.isCompleted;
                    t.on('click', function() {
                        var v = !checkboxes[e.id];
                        checkboxes[e.id] = v;
                        bus.post('Complete', {id: e.id, isCompleted: v});
                    });

                    t.find('.js-edit').on('click', function(event) {
                        framework7.prompt(
                            "Enter a new label",
                            "Edit task",
                            function(value) {
                                if (value.trim().length > 0) {
                                    bus.post("Edit", { id: e.id, label: value });
                                }
                            },
                            function() {} // Ignore
                        );
                        $('.modal-text-input').val(e.label);
                        event.stopPropagation();
                    });

                    t.find('.js-delete').on('click', function(event) {
                        framework7.confirm(
                            "Are you sure you want to delete " + e.label + "?",
                            "Delete task",
                            function() {
                                bus.post("Delete", e.id);
                            },
                            function() {} // Ignore
                        );
                        event.stopPropagation();
                    });

                    taskList.append(t);
                };
                capture(data[i], template.clone());
            }
        }
    });

    $('.js-add').on('click', function() {
        framework7.prompt(
            "Enter a label",
            "Add a new task",
            function(value) {
                if (value.trim().length > 0) {
                    bus.post("Add", value);
                }
            },
            function () {} // Ignore
        );
    });
});