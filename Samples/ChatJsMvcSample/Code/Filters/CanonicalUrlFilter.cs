using System;
using System.Configuration;
using System.Web.Mvc;

namespace ChatJsMvcSample.Code.Filters
{
    public class CanonicalUrlHttpsFilter : IActionFilter
    {
        public void OnActionExecuting(ActionExecutingContext filterContext)
        {
            var request = filterContext.RequestContext.HttpContext.Request;
            var uriBuilder = new UriBuilder(request.Url);

            var isNotCanonical = !request.IsAjaxRequest() && request.Url != null && !request.Url.IsLoopback &&
                                  request.Url.Host != ConfigurationManager.AppSettings["CanonicalUrlHost"];
        }

        public void OnActionExecuted(ActionExecutedContext filterContext)
        {
        }
    }
}