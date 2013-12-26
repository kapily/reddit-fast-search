

import praw
from reddit_submission import Submission
from reddit_database_manager import DatabaseManager
from pprint import pprint
import time
from secret import REDDIT_USER_AGENT
from search_terms import search_terms_for_reddit
from search_subreddits import subreddits
from base36 import base36decode

# For PRAW Documentation:
# https://praw.readthedocs.org/en/latest/pages/code_overview.html

__author__ = 'Kapil'

DATABASE_PATH = "reddit_submissions.sqlite"

class RedditFetcher:
  def __init__(self, db_manager):
    self.r = praw.Reddit(user_agent=REDDIT_USER_AGENT)
    self.db_manager = db_manager

  def __update_given_submissions(self, submissions):
    for submission in submissions:
      submission_id = base36decode(submission.id)
      if not self.db_manager.row_exists(submission_id):
        s = Submission.from_reddit_api(submission)
        self.db_manager.insert_submission(s)
      else:
        # if submission does exist, update its score
        new_submission = Submission.from_reddit_api(submission)
        # existing_submission =
        query = 'SELECT * FROM submissions WHERE id = %d;' % submission_id
        existing_submissions = [Submission(x) for x in self.db_manager.query(query)]
        assert(len(existing_submissions) == 1)
        existing_submission = existing_submissions[0]
        #print "existing score: ", existing_submission.score
        #print "new score: ", new_submission.score
        if existing_submission.score != new_submission.score:
          #print "going to replace old submission!"
          #print "NEW_SUBMISSION: ", new_submission.to_tuple()
          #print "BEFORE: ", existing_submission.to_tuple()
          existing_submission.score = new_submission.score
          #print "AFTER: ", existing_submission.to_tuple()
          #time.sleep(5)
          self.db_manager.replace_submission(existing_submission)

      # Debug printing:
      if self.db_manager.new_rows_written % 100 == 0 and self.db_manager.new_rows_written != 0:
          print "Entries written so far: ", self.db_manager.new_rows_written, " [", self.db_manager.rows_written, " total]"

  def update_subreddit(self, subreddit):
    # get_hot
    submissions = self.r.get_subreddit(subreddit).get_hot(limit=1000)
    self.__update_given_submissions(submissions)
    print "Added", self.db_manager.new_rows_written, "new entries after get_subreddit (get_hot) [", self.db_manager.rows_written, "total]"
    # get_new
    submissions = self.r.get_subreddit(subreddit).get_new(limit=1000)
    self.__update_given_submissions(submissions)
    print "Added", self.db_manager.new_rows_written, "new entries after get_subreddit (get_new) [", self.db_manager.rows_written, "total]"
    # get_rising
    submissions = self.r.get_subreddit(subreddit).get_rising(limit=1000)
    self.__update_given_submissions(submissions)
    print "Added", self.db_manager.new_rows_written, "new entries after get_subreddit (get_rising) [", self.db_manager.rows_written, "total]"
    # get_controversial
    submissions = self.r.get_subreddit(subreddit).get_controversial(limit=1000)
    self.__update_given_submissions(submissions)
    print "Added", self.db_manager.new_rows_written, "new entries after get_subreddit (get_controversial) [", self.db_manager.rows_written, "total]"
    # get_top
    submissions = self.r.get_subreddit(subreddit).get_top(limit=1000)
    self.__update_given_submissions(submissions)
    print "Added", self.db_manager.new_rows_written, "new entries after get_subreddit (get_top) [", self.db_manager.rows_written, "total]"

    search_terms = []
    search_terms.extend(search_terms_for_reddit['all'])
    if subreddit in search_terms_for_reddit:
        search_terms.extend(search_terms_for_reddit[subreddit])

    for search_term in search_terms:
      submissions = self.r.search(search_term, subreddit, 'new', None, 'all')
      self.__update_given_submissions(submissions)
      print "Added", self.db_manager.new_rows_written, "new entries after (new) search for", search_term, " [", self.db_manager.rows_written, "total]"
      submissions = self.r.search(search_term, subreddit, 'top', None, 'all')
      self.__update_given_submissions(submissions)
      print "Added", self.db_manager.new_rows_written, "new entries after (top) search for", search_term, " [", self.db_manager.rows_written, "total]"

    # TODO: add all posts by all the users in the given subreddits



    # TODO: get the newest after a submission id
    # r.get_subreddit('python').get_top(limit=None,
    #                                  place_holder=submission.id)


  def update_posts(self):
    #submissions = r.get_subreddit('python').get_top(limit=10)

    for subreddit in subreddits:
      self.update_subreddit(subreddit)

