export default function teachers(router) {
    router.get('/', 'TeacherController@findAll');
}
