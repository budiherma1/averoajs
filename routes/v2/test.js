export default function test(router) {
    router.get('/', 'SampleController@sampleMethodView');
    router.prefix('otherprefix', () => {
        router.get('/', 'SampleController@sampleMethodView');
    });
}
