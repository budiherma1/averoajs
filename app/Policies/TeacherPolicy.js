/**
 * Who may change a Teacher (registered in app/Providers/AuthProvider.js).
 * Methods are named after abilities: Gate.allows(user, 'update', teacher) calls
 * update(user, teacher); routes use can('update', loader) (routes/api.js).
 */
class TeacherPolicy {
  /** Admins may do everything; undefined lets the ability method decide. */
  before(user) {
    if (user.isAdmin?.() === true) return true;
    return undefined;
  }

  /** The owner (teacher.user_id) may update their teacher. */
  update(user, teacher) {
    return teacher.user_id != null && Number(teacher.user_id) === Number(user.id);
  }

  delete(user, teacher) {
    return this.update(user, teacher);
  }

  /** Setting or changing `user_id`: admins only (granted by before()). */
  changeOwner() {
    return false;
  }
}

export default TeacherPolicy;
