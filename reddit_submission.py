import json

__author__ = 'kyedidi'


class Submission:
  def __init__(self, submission_tuple):
    self.id = submission_tuple[0]
    self.title = submission_tuple[1]
    self.score = submission_tuple[2]
    self.adult_content = submission_tuple[3]
    self.author = submission_tuple[4]
    self.created = submission_tuple[5]
    self.subreddit = submission_tuple[6]
    self.url = submission_tuple[7]
    self.permalink = submission_tuple[8]

  @staticmethod
  def submission_list_to_json(submissions):
    final_result = {}
    result = []
    for submission in submissions:
      media_embed_json = None if submission.media_embed_json is None else json.loads(submission.media_embed_json)
      media_json = None if submission.media_json is None else json.loads(submission.media_json)
      py_obj = {
        'id': submission.id,
        'title': submission.title,
        'score': submission.score,
        'adult_content': bool(submission.adult_content),
        'permalink': submission.permalink
      }
      result.append(py_obj)
    final_result['result'] = result
    return json.dumps(final_result)

  @staticmethod
  def from_reddit_api(r):
    # TODO: submission is not being set properly
    selftext = None if not r.selftext else r.selftext
    # media = None if not r.media else json.dumps(r.media)
    media_embed = None  # useless feild now
    # media_embed = None if not r.media_embed else json.dumps(r.media_embed)
    url = None if not r.url else r.url
    author_name = "unknown" if not r.author else r.author.name

    # NOTE: media is just being set to None because I'll set it myself after
    # looking through the file
    submission_tuple = (r.id, r.title, r.score, int(r.over_18),
                        author_name, r.created, r.subreddit.display_name, r.permalink)
    s = Submission(submission_tuple)
    # Moved the code below to reddit_imgur_main.py
    # Imgur.load_imgur_information_for_submission(s)
    # print s
    return s

  def to_tuple(self):
    # returns a tuple representation of the submission
    return (self.id, self.title, self.score,
            self.adult_content, self.author,
            self.created, self.subreddit, self.url, self.permalink)
