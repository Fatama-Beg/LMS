'use strict';

module.exports = {
  async submit(ctx) {
    const { id } = ctx.params;
    const { answers } = ctx.request.body;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Authentication required to submit quiz.');
    }

    const quiz = await strapi.entityService.findOne('api::quiz.quiz', id);
    if (!quiz) {
      return ctx.notFound('Quiz not found.');
    }

    let earnedPoints = 0;
    let totalPoints = 0;
    const questions = quiz.questions || [];

    questions.forEach((q) => {
      totalPoints += (q.points || 10);
      if (answers && answers[q.id] === q.correctAnswerIndex) {
        earnedPoints += (q.points || 10);
      }
    });

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const isPassed = percentage >= (quiz.passingScore || 70);

    const submission = await strapi.entityService.create('api::submission.submission', {
      data: {
        quiz: quiz.id,
        student: user.id,
        score: earnedPoints,
        totalPoints,
        percentage,
        isPassed,
        answers,
        submittedAt: new Date(),
      },
    });

    return {
      success: true,
      data: {
        score: earnedPoints,
        totalPoints,
        percentage,
        isPassed,
        submissionId: submission.id,
      }
    };
  }
};
