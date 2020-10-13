import I18n from "I18n";
import { createWidget } from "discourse/widgets/widget";
import { ajax } from "discourse/lib/ajax";
import RawHtml from "discourse/widgets/raw-html";
import { popupAjaxError } from "discourse/lib/ajax-error";

export default createWidget("vote-box", {
  tagName: "div.voting-wrapper",
  buildKey: () => "vote-box",

  buildClasses() {
    if (this.siteSettings.voting_show_who_voted) {
      return "show-pointer";
    }
  },

  defaultState() {
    return { allowClick: true, initialVote: false };
  },

  html(attrs, state) {
    let voteCount = this.attach("vote-count", attrs);
    let voteButton = this.attach("vote-button", attrs);
    let voteOptions = this.attach("vote-options", attrs);
    let contents = [voteCount, voteButton, voteOptions];

    if (state.votesAlert > 0) {
      const html =
        "<div class='voting-popup-menu vote-options popup-menu'>" +
        I18n.t("voting.votes_left", {
          count: state.votesAlert,
          path: this.currentUser.get("path") + "/activity/votes",
        }) +
        "</div>";
      contents.push(new RawHtml({ html }));
    }

    return contents;
  },

  hideVotesAlert() {
    if (this.state.votesAlert) {
      this.state.votesAlert = null;
      this.scheduleRerender();
    }
  },

  click() {
    this.hideVotesAlert();
  },

  clickOutside() {
    this.hideVotesAlert();
  },

  addVote() {
    let topic = this.attrs;
    let state = this.state;
    return ajax("/voting/vote", {
      type: "POST",
      data: {
        topic_id: topic.id,
      },
    })
      .then((result) => {
        topic.set("vote_count", result.vote_count);
        topic.set("user_voted", true);
        this.currentUser.setProperties({
          votes_exceeded: !result.can_vote,
          votes_left: result.votes_left,
        });
        if (result.alert) {
          state.votesAlert = result.votes_left;
        }
        topic.set("who_voted", result.who_voted);
        state.allowClick = true;
        this.scheduleRerender();
      })
      .catch(popupAjaxError);
  },

  removeVote() {
    let topic = this.attrs;
    let state = this.state;
    return ajax("/voting/unvote", {
      type: "POST",
      data: {
        topic_id: topic.id,
      },
    })
      .then((result) => {
        topic.set("vote_count", result.vote_count);
        topic.set("user_voted", false);
        this.currentUser.setProperties({
          votes_exceeded: !result.can_vote,
          votes_left: result.votes_left,
        });
        topic.set("who_voted", result.who_voted);
        state.allowClick = true;
        this.scheduleRerender();
      })
      .catch(popupAjaxError);
  },
});
